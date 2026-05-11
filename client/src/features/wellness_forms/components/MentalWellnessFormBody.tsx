import React from 'react';
import { MentalWellnessFormSectionsAlpha } from './MentalWellnessFormSectionsAlpha';
import { MentalWellnessFormSectionsBeta } from './MentalWellnessFormSectionsBeta';
import { MentalWellnessFormSectionsGamma } from './MentalWellnessFormSectionsGamma';
import type { MentalWellnessSectionsProps } from './mentalWellnessForm.sections.types';

/** Single responsibility: compose printable mental wellness form sections in a container. */
export const MentalWellnessFormBody: React.FC<MentalWellnessSectionsProps> = (props) => (
  <div className="form-container">
    <MentalWellnessFormSectionsAlpha {...props} />
    <MentalWellnessFormSectionsBeta {...props} />
    <MentalWellnessFormSectionsGamma {...props} />
  </div>
);
