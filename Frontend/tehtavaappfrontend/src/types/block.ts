export interface Block {
  id: string;
  title: string;
  type: string;
  isCollapsed: boolean;
  isCompleted?: boolean;
  isLocked?: boolean;
  content?: any;
  children?: Block[];
} 