import { useContext } from 'react';
import { dataSourceContext } from '@/context/data-source-context/data-source-context';

export const useDataSources = () => useContext(dataSourceContext);
