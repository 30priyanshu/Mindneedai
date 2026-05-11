from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import torch
import torch.nn.functional as F
from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification
import numpy as np
import os
import tempfile
from datetime import datetime
import soundfile as sf
import librosa

app = Flask(__name__, static_folder='.')
CORS(app)

emotion_labels = ["angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"]
emotion_icons = {
    "angry": "😠", "calm": "😌", "disgust": "🤢", "fearful": "😨",
    "happy": "😊", "neutral": "😐", "sad": "😢", "surprised": "😲"
}

model_name = "Dpngtm/wav2vec2-emotion-recognition"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

CHUNK_DURATION = 30
OVERLAP_DURATION = 5
SAMPLE_RATE = 16000
MIN_AUDIO_LENGTH = 1.0

def load_audio_file(file_path):
    try:
        audio_data, sr = sf.read(file_path, dtype='float32')
        if len(audio_data.shape) > 1:
            audio_data = np.mean(audio_data, axis=1)
        audio_tensor = torch.from_numpy(audio_data).float()
        if len(audio_tensor.shape) == 1:
            audio_tensor = audio_tensor.unsqueeze(0)
        return audio_tensor, sr
    except Exception as e:
        try:
            audio_data, sr = librosa.load(file_path, sr=None, mono=True)
            audio_tensor = torch.from_numpy(audio_data).float().unsqueeze(0)
            return audio_tensor, sr
        except Exception as e2:
            raise Exception(f"Failed to load audio: {str(e)}")

def preprocess_audio(audio_tensor, sr):
    if sr != SAMPLE_RATE:
        audio_np = audio_tensor.squeeze().numpy()
        audio_resampled = librosa.resample(audio_np, orig_sr=sr, target_sr=SAMPLE_RATE)
        audio_tensor = torch.from_numpy(audio_resampled).unsqueeze(0)
    if audio_tensor.shape[0] > 1:
        audio_tensor = torch.mean(audio_tensor, dim=0, keepdim=True)
    max_val = torch.max(torch.abs(audio_tensor))
    if max_val > 0:
        audio_tensor = audio_tensor / max_val
    return audio_tensor.squeeze()

def detect_silence(audio_tensor, threshold=0.01):
    return torch.mean(torch.abs(audio_tensor)) < threshold

def process_chunk(audio_chunk):
    try:
        if len(audio_chunk) < SAMPLE_RATE * 0.5:
            return None
        audio_np = audio_chunk.numpy()
        if np.std(audio_np) < 0.001:
            return None
        inputs = processor(audio_np, sampling_rate=SAMPLE_RATE, return_tensors='pt', padding=True)
        input_values = inputs.input_values.to(device)
        with torch.no_grad():
            outputs = model(input_values)
            logits = outputs.logits
            probs = F.softmax(logits, dim=-1)[0].cpu().numpy()
        return probs
    except Exception as e:
        print(f"Error processing chunk: {str(e)}")
        return None

def create_chunks(audio_tensor, chunk_size, overlap_size):
    total_samples = audio_tensor.shape[0]
    chunk_samples = int(chunk_size * SAMPLE_RATE)
    overlap_samples = int(overlap_size * SAMPLE_RATE)
    step_samples = chunk_samples - overlap_samples
    chunks = []
    positions = []
    start = 0
    while start < total_samples:
        end = min(start + chunk_samples, total_samples)
        chunk = audio_tensor[start:end]
        if len(chunk) >= SAMPLE_RATE * MIN_AUDIO_LENGTH:
            chunks.append(chunk)
            positions.append((start / SAMPLE_RATE, end / SAMPLE_RATE))
        if end >= total_samples:
            break
        start += step_samples
    return chunks, positions

def aggregate_emotions(chunk_results, chunk_positions):
    if not chunk_results:
        return None
    valid_results = [r for r in chunk_results if r is not None]
    if not valid_results:
        return None
    weights = []
    for i, (start, end) in enumerate(chunk_positions):
        if i < len(valid_results):
            duration = end - start
            max_confidence = np.max(valid_results[i])
            weight = duration * (0.5 + 0.5 * max_confidence)
            weights.append(weight)
    weights = np.array(weights)
    weights = weights / np.sum(weights)
    aggregated = np.zeros(len(emotion_labels))
    for prob, weight in zip(valid_results, weights):
        aggregated += prob * weight
    aggregated = aggregated / np.sum(aggregated)
    return aggregated

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        audio_file = request.files['audio']
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_path = tmp_file.name
        try:
            audio_tensor, sr = load_audio_file(tmp_path)
        except Exception as e:
            os.unlink(tmp_path)
            return jsonify({'error': f'Failed to load audio: {str(e)}'}), 400
        os.unlink(tmp_path)
        duration = audio_tensor.shape[1] / sr
        if duration < MIN_AUDIO_LENGTH:
            return jsonify({'error': f'Audio too short (minimum {MIN_AUDIO_LENGTH}s)'}), 400
        audio_processed = preprocess_audio(audio_tensor, sr)
        if detect_silence(audio_processed):
            return jsonify({'error': 'Audio appears to be silent'}), 400
        chunks, positions = create_chunks(audio_processed, CHUNK_DURATION, OVERLAP_DURATION)
        if not chunks:
            return jsonify({'error': 'No valid audio chunks found'}), 400
        chunk_results = []
        chunk_emotions = []
        for i, chunk in enumerate(chunks):
            result = process_chunk(chunk)
            chunk_results.append(result)
            if result is not None:
                chunk_emotion = {
                    'start': round(positions[i][0], 2),
                    'end': round(positions[i][1], 2),
                    'emotions': {
                        emotion_labels[j]: float(result[j])
                        for j in range(len(emotion_labels))
                    },
                    'dominant': emotion_labels[np.argmax(result)]
                }
                chunk_emotions.append(chunk_emotion)
        aggregated = aggregate_emotions(chunk_results, positions)
        if aggregated is None:
            return jsonify({'error': 'Failed to process audio'}), 500
        overall_emotions = {
            emotion_labels[i]: float(aggregated[i])
            for i in range(len(emotion_labels))
        }
        dominant_emotion = emotion_labels[np.argmax(aggregated)]
        response = {
            'success': True,
            'duration': round(duration, 2),
            'chunks_processed': len([r for r in chunk_results if r is not None]),
            'overall_emotion': dominant_emotion,
            'overall_confidence': float(np.max(aggregated)),
            'emotion_scores': overall_emotions,
            'chunk_analysis': chunk_emotions,
            'timestamp': datetime.now().isoformat()
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': device
    })

if __name__ == '__main__':
    print(f"Server running on device: {device}")
    print(f"Model loaded: {model_name}")
    app.run(host='0.0.0.0', port=5000, debug=False)