'use client';

import React from 'react';
import { Mission, MissionState } from '../../types';
import { S3VaultSimulation } from './S3VaultSimulation';
import { SecurityGroupGateSimulation } from './SecurityGroupGateSimulation';
import { IAMKeycardSimulation } from './IAMKeycardSimulation';

interface Props {
  mission: Mission;
  currentState: MissionState;
  onApplyReferenceFix?: () => void;
}

export function VisualSimulationCanvas({
  mission,
  currentState,
  onApplyReferenceFix,
}: Props) {
  if (currentState.type === 's3') {
    return (
      <S3VaultSimulation
        config={currentState.config}
        onApplyReferenceFix={onApplyReferenceFix}
      />
    );
  }

  if (currentState.type === 'security-group') {
    return (
      <SecurityGroupGateSimulation config={currentState.config} />
    );
  }

  if (currentState.type === 'iam-role') {
    return (
      <IAMKeycardSimulation config={currentState.config} />
    );
  }

  return null;
}
