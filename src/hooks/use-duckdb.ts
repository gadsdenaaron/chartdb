import { useContext } from 'react';
import { duckdbContext } from '@/context/duckdb-context/duckdb-context';

export const useDuckDB = () => useContext(duckdbContext);
