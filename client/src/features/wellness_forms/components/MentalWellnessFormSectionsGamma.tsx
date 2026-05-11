import React from 'react';
import { MentalWellnessCheckboxGroup } from './MentalWellnessCheckboxGroup';
import { behaviorOptions, insightOptions, judgmentOptions } from './mentalWellnessForm.options';
import type { MentalWellnessSectionsProps } from './mentalWellnessForm.sections.types';

/** Single responsibility: Behavior + Insight + Judgment sections. */
export const MentalWellnessFormSectionsGamma: React.FC<MentalWellnessSectionsProps> = ({
  data,
  mode,
  handleCheckboxChange,
  handleTextChange,
}) => (
  <>
    <div className="section">
      <div className="section-title">BEHAVIOR</div>
      <div className="section-content">
        <div className="mood-options">
          <MentalWellnessCheckboxGroup
            options={behaviorOptions}
            selectedValues={data.behavior.options}
            section="behavior"
            field="options"
            namePrefix="behavior"
            mode={mode}
            onToggle={handleCheckboxChange}
          />
        </div>
        <div className="comments-row">
          <label>Comments:</label>
          {mode === 'edit' ? (
            <textarea
              value={data.behavior.comments}
              onChange={(e) => handleTextChange('behavior', 'comments', e.target.value)}
            />
          ) : (
            <div className="comment-text">{data.behavior.comments || ''}</div>
          )}
        </div>
      </div>
    </div>

    <div className="section">
      <div className="section-title">INSIGHT</div>
      <div className="single-line-section">
        <div />
        <div className="options">
          <MentalWellnessCheckboxGroup
            options={insightOptions}
            selectedValues={data.insight.option ? [data.insight.option] : []}
            section="insight"
            field="option"
            namePrefix="insight"
            isSingleSelect
            mode={mode}
            onToggle={handleCheckboxChange}
          />
        </div>
        <div className="comments-inline">
          <label>Comments:</label>
          {mode === 'edit' ? (
            <input
              type="text"
              value={data.insight.comments}
              onChange={(e) => handleTextChange('insight', 'comments', e.target.value)}
            />
          ) : (
            <div className="comment-text">{data.insight.comments || ''}</div>
          )}
        </div>
      </div>
    </div>

    <div className="section">
      <div className="section-title">JUDGMENT</div>
      <div className="single-line-section">
        <div />
        <div className="options">
          <MentalWellnessCheckboxGroup
            options={judgmentOptions}
            selectedValues={data.judgment.option ? [data.judgment.option] : []}
            section="judgment"
            field="option"
            namePrefix="judgment"
            isSingleSelect
            mode={mode}
            onToggle={handleCheckboxChange}
          />
        </div>
        <div className="comments-inline">
          <label>Comments:</label>
          {mode === 'edit' ? (
            <input
              type="text"
              value={data.judgment.comments}
              onChange={(e) => handleTextChange('judgment', 'comments', e.target.value)}
            />
          ) : (
            <div className="comment-text">{data.judgment.comments || ''}</div>
          )}
        </div>
      </div>
    </div>
  </>
);
