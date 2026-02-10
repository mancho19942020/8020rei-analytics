/**
 * Workspace Type Definitions
 *
 * Type definitions for workspace-level configurations and state.
 */

import { Widget } from './widget';

/**
 * Workspace State
 */
export interface WorkspaceState {
  /** Current layout configuration */
  layout: Widget[];

  /** Whether workspace is in edit mode */
  editMode: boolean;

  /** Active navigation tab */
  activeTab: string;

  /** Whether layout has unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Layout Preset
 *
 * Pre-configured layout templates.
 */
export interface LayoutPreset {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Layout configuration */
  layout: Widget[];

  /** Preview thumbnail (optional) */
  thumbnail?: string;
}
