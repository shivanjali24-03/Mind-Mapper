import { createContext, useContext } from 'react';

// Per-render view info that custom nodes need, without storing it in the map data
export const ViewContext = createContext({
  childCounts: {},
  hiddenCounts: {},
  matches: new Set(),
  currentMatch: null,
  readOnly: false,
  toggleCollapse: () => {},
});

export const useView = () => useContext(ViewContext);
