import React, { createContext, useContext, ReactNode } from 'react';
import { Block } from '../../../types/blocks';
import { useBlocks } from '../hooks/useBlocks';
import { useBlockGroups } from '../hooks/useBlockGroups';

// Define the context type based on the return values of our hooks
type BlockContextType = ReturnType<typeof useBlocks> & ReturnType<typeof useBlockGroups>;

// Create the context with a default value of undefined
const BlockContext = createContext<BlockContextType | undefined>(undefined);

interface BlockProviderProps {
  children: ReactNode;
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
  initialUnlockedGroups?: string[];
}

/**
 * Provider component that wraps the application or a section of it
 * to provide block functionality
 */
export const BlockProvider: React.FC<BlockProviderProps> = ({
  children,
  initialBlocks = [],
  onSave,
  initialUnlockedGroups = []
}) => {
  // Initialize our hooks
  const blocksHook = useBlocks(initialBlocks, onSave);
  const groupsHook = useBlockGroups(initialUnlockedGroups);

  // Combine the values from both hooks
  const contextValue: BlockContextType = {
    ...blocksHook,
    ...groupsHook
  };

  return (
    <BlockContext.Provider value={contextValue}>
      {children}
    </BlockContext.Provider>
  );
};

/**
 * Custom hook to use the block context
 */
export const useBlockContext = (): BlockContextType => {
  const context = useContext(BlockContext);
  if (context === undefined) {
    throw new Error('useBlockContext must be used within a BlockProvider');
  }
  return context;
}; 