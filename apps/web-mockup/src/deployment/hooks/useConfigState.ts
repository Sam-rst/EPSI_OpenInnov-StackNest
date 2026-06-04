import { useState } from 'react';
import type { InstanceSize } from '../data/sizes';

export interface ConfigState {
  name: string;
  version: string;
  size: InstanceSize['id'];
  storage: number;
  env: string;
  region: string;
  backups: boolean;
}

export interface ConfigStateActions {
  setName: (v: string) => void;
  setVersion: (v: string) => void;
  setSize: (v: InstanceSize['id']) => void;
  setStorage: (v: number) => void;
  setEnv: (v: string) => void;
  setRegion: (v: string) => void;
  setBackups: (v: boolean) => void;
}

export function useConfigState(): ConfigState & ConfigStateActions {
  const [name, setName] = useState('pg-prod-eu');
  const [version, setVersion] = useState('16.4');
  const [size, setSize] = useState<InstanceSize['id']>('medium');
  const [storage, setStorage] = useState(50);
  const [env, setEnv] = useState('prod');
  const [region, setRegion] = useState('eu-west-3');
  const [backups, setBackups] = useState(true);

  return {
    name, version, size, storage, env, region, backups,
    setName, setVersion, setSize, setStorage, setEnv, setRegion, setBackups,
  };
}
