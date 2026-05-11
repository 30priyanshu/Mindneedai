import React from 'react';
import { MentalWellnessCheckboxGroup } from './MentalWellnessCheckboxGroup';
import {
  attentionOptions,
  delusionOptions,
  hallucinationOptions,
  homicidalityOptions,
  memoryOptions,
  orientationOptions,
  perceptionOtherOptions,
  suicidalityOptions,
} from './mentalWellnessForm.options';
import type { MentalWellnessSectionsProps } from './mentalWellnessForm.sections.types';

/** Single responsibility: Cognition + Perception + Thoughts sections. */
export const MentalWellnessFormSectionsBeta: React.FC<MentalWellnessSectionsProps> = ({
  data,
  mode,
  handleCheckboxChange,
  handleTextChange,
}) => (
  <>
    <div className="section">
      <div className="section-title">COGNITION</div>
      <div className="section-content no-padding">
        <div className="field-row">
          <div className="field-label">Orientation Impairment</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={orientationOptions}
              selectedValues={data.cognition.orientationImpairment}
              section="cognition"
              field="orientationImpairment"
              namePrefix="orientation"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Memory Impairment</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={memoryOptions}
              selectedValues={data.cognition.memoryImpairment}
              section="cognition"
              field="memoryImpairment"
              namePrefix="memory"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Attention</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={attentionOptions}
              selectedValues={data.cognition.attention}
              section="cognition"
              field="attention"
              namePrefix="attention"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="comments-row">
          <label>Comments:</label>
          {mode === 'edit' ? (
            <textarea
              value={data.cognition.comments}
              onChange={(e) => handleTextChange('cognition', 'comments', e.target.value)}
            />
          ) : (
            <div className="comment-text">{data.cognition.comments || ''}</div>
          )}
        </div>
      </div>
    </div>

    <div className="section">
      <div className="section-title">PERCEPTION</div>
      <div className="section-content no-padding">
        <div className="field-row">
          <div className="field-label">Hallucinations</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={hallucinationOptions}
              selectedValues={data.perception.hallucinations}
              section="perception"
              field="hallucinations"
              namePrefix="hallucination"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Other</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={perceptionOtherOptions}
              selectedValues={data.perception.other}
              section="perception"
              field="other"
              namePrefix="perception-other"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="comments-row">
          <label>Comments:</label>
          {mode === 'edit' ? (
            <textarea
              value={data.perception.comments}
              onChange={(e) => handleTextChange('perception', 'comments', e.target.value)}
            />
          ) : (
            <div className="comment-text">{data.perception.comments || ''}</div>
          )}
        </div>
      </div>
    </div>

    <div className="section">
      <div className="section-title">THOUGHTS</div>
      <div className="section-content no-padding">
        <div className="field-row">
          <div className="field-label">Suicidality</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={suicidalityOptions}
              selectedValues={data.thoughts.suicidality}
              section="thoughts"
              field="suicidality"
              namePrefix="suicidality"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Homicidality</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={homicidalityOptions}
              selectedValues={data.thoughts.homicidality}
              section="thoughts"
              field="homicidality"
              namePrefix="homicidality"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Delusions</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={delusionOptions}
              selectedValues={data.thoughts.delusions}
              section="thoughts"
              field="delusions"
              namePrefix="delusions"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="comments-row">
          <label>Comments:</label>
          {mode === 'edit' ? (
            <textarea
              value={data.thoughts.comments}
              onChange={(e) => handleTextChange('thoughts', 'comments', e.target.value)}
            />
          ) : (
            <div className="comment-text">{data.thoughts.comments || ''}</div>
          )}
        </div>
      </div>
    </div>
  </>
);
