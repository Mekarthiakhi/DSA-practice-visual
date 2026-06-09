/**
 * Keyboard Shortcuts Module
 * Defines and manages keyboard shortcuts for the IDE
 */

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  action: () => void
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()

  constructor() {
    this.setupDefaultShortcuts()
  }

  private setupDefaultShortcuts() {
    // These will be bound to actual handlers in components
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut) {
    const key = this.getShortcutKey(shortcut)
    this.shortcuts.set(key, shortcut)
  }

  /**
   * Generate unique key for shortcut
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts = [
      shortcut.ctrl ? 'Ctrl' : '',
      shortcut.shift ? 'Shift' : '',
      shortcut.alt ? 'Alt' : '',
      shortcut.meta ? 'Meta' : '',
      shortcut.key,
    ].filter(Boolean)
    return parts.join('+')
  }

  /**
   * Handle keyboard event
   */
  handleKeyEvent(event: KeyboardEvent): boolean {
    const key = event.key
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey
    const meta = event.metaKey

    for (const shortcut of this.shortcuts.values()) {
      if (
        shortcut.key.toLowerCase() === key.toLowerCase() &&
        (shortcut.ctrl === undefined || shortcut.ctrl === ctrl) &&
        (shortcut.shift === undefined || shortcut.shift === shift) &&
        (shortcut.alt === undefined || shortcut.alt === alt) &&
        (shortcut.meta === undefined || shortcut.meta === meta)
      ) {
        event.preventDefault()
        shortcut.action()
        return true
      }
    }
    return false
  }

  /**
   * Get all shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Get shortcuts grouped by category
   */
  getShortcutsByCategory(): Map<string, KeyboardShortcut[]> {
    const grouped = new Map<string, KeyboardShortcut[]>()
    for (const shortcut of this.shortcuts.values()) {
      const category = this.getCategoryFromDescription(shortcut.description)
      if (!grouped.has(category)) {
        grouped.set(category, [])
      }
      grouped.get(category)!.push(shortcut)
    }
    return grouped
  }

  private getCategoryFromDescription(description: string): string {
    if (description.includes('Code')) return 'Code'
    if (description.includes('Play') || description.includes('Pause')) return 'Playback'
    if (description.includes('Step')) return 'Navigation'
    if (description.includes('Clear') || description.includes('Reset')) return 'Editor'
    return 'General'
  }
}

// Standard IDE keyboard shortcuts
export const IDE_SHORTCUTS = {
  RUN_CODE: { key: 'Enter', ctrl: true, description: '▶️ Run Code' },
  PAUSE: { key: ' ', description: '⏸️ Pause Playback' },
  STEP_NEXT: { key: 'ArrowRight', description: '➡️ Step Next' },
  STEP_PREV: { key: 'ArrowLeft', description: '⬅️ Step Previous' },
  GOTO_FIRST: { key: 'Home', description: '⏮️ Go to First Step' },
  GOTO_LAST: { key: 'End', description: '⏭️ Go to Last Step' },
  CLEAR_CONSOLE: { key: 'l', ctrl: true, description: '🗑️ Clear Console' },
  TOGGLE_AI: { key: 'a', alt: true, description: '🤖 Toggle AI Panel' },
  TOGGLE_SETTINGS: { key: ',', ctrl: true, description: '⚙️ Settings' },
  INCREASE_SPEED: { key: '+', ctrl: true, description: '⏩ Increase Speed' },
  DECREASE_SPEED: { key: '-', ctrl: true, description: '⏪ Decrease Speed' },
}

export const shortcutManager = new KeyboardShortcutManager()
