import React from 'react';
import { MentalWellnessCheckboxGroup } from './MentalWellnessCheckboxGroup';
import {
  affectOptions,
  appearanceOptions,
  eyeContactOptions,
  moodOptions,
  motorActivityOptions,
  speechOptions,
} from './mentalWellnessForm.options';
import type { MentalWellnessSectionsProps } from './mentalWellnessForm.sections.types';

/** Single responsibility: header + Observations + Mood sections of the mental wellness form. */
export const MentalWellnessFormSectionsAlpha: React.FC<MentalWellnessSectionsProps> = ({
  data,
  mode,
  handleCheckboxChange,
  handleTextChange,
}) => (
  <>
    <h1>Mental Wellness Form</h1>

    <div className="header-section">
      <div className="header-field">
        <label>Client Name</label>
        {mode === 'edit' ? (
          <input
            type="text"
            value={data.clientName}
            onChange={(e) => handleTextChange('clientName', 'clientName', e.target.value)}
          />
        ) : (
          <div className="view-text">{data.clientName || ''}</div>
        )}
      </div>
      <div className="header-field">
        <label>Date</label>
        {mode === 'edit' ? (
          <input
            type="date"
            value={data.date}
            onChange={(e) => handleTextChange('date', 'date', e.target.value)}
          />
        ) : (
          <div className="view-text">{data.date || ''}</div>
        )}
      </div>
    </div>

    <div className="section">
      <div className="section-title">OBSERVATIONS</div>
      <div className="section-content no-padding">
        <div className="field-row">
          <div className="field-label">Appearance</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={appearanceOptions}
              selectedValues={data.observations.appearance}
              section="observations"
              field="appearance"
              namePrefix="appearance"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Speech</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={speechOptions}
              selectedValues={data.observations.speech}
              section="observations"
              field="speech"
              namePrefix="speech"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Eye Contact</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={eyeContactOptions}
              selectedValues={data.observations.eyeContact}
              section="observations"
              field="eyeContact"
              namePrefix="eye-contact"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Motor Activity</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={motorActivityOptions}
              selectedValues={data.observations.motorActivity}
              section="observations"
              field="motorActivity"
              namePrefix="motor-activity"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field-label">Affect</div>
          <div className="field-options">
            <MentalWellnessCheckboxGroup
              options={affectOptions}
              selectedValues={data.observations.affect}
              section="observations"
              field="affect"
              namePrefix="affect"
              mode={mode}
              onToggle={handleCheckboxChange}
            />
          </div>
        </div>
        <div className="comments-row">
          <label>Comments:</label>
          {mode === 'edit' ? (
            <textarea
              value={data.observations.comments}
              onChange={(e) => handleTextChange('observations', 'comments', e.target.value)}
            />
          ) : (
            <div className="comment-text">{data.observations.comments || ''}</div>
          )}
        </div>
      </div>
    </div>

    <div className="section mood-section">
      <div className="section-title">MOOD</div>
      <div className="section-content">
        <div className="mood-options">
          <MentalWellnessCheckboxGroup
            options={moodOptions}
            selectedValues={data.mood.options}
            section="mood"
            field="options"
            namePrefix="mood"
            mode={mode}
            onToggle={handleCheckboxChange}
          />
        </div>
        <div className="comments-row">
          <label>Comments:</label>
          {mode === 'edit' ? (
            <textarea
              value={data.mood.comments}
              onChange={(e) => handleTextChange('mood', 'comments', e.target.value)}
            />
          ) : (
            <div className="comment-text">{data.mood.comments || ''}</div>
          )}
        </div>
      </div>
    </div>
  </>
);
