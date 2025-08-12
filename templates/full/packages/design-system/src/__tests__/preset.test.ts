/**
 * Tests for Atlas Design System Preset
 */

import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { atlasPreset, atlasStylesPath } from './index.js'

describe('Atlas Design System', () => {
  describe('Preset', () => {
    const preset = atlasPreset()
    
    it('should export atlasPreset function', () => {
      expect(atlasPreset).toBeDefined()
      expect(typeof atlasPreset).toBe('function')
    })
    
    it('should return a valid preset configuration', () => {
      expect(preset).toBeDefined()
      expect(preset.theme).toBeDefined()
      expect(preset.theme?.extend).toBeDefined()
    })
    
    describe('Typography Scale', () => {
      const fontSize = preset.theme?.extend?.fontSize
      
      it('should expose all typography scale keys', () => {
        expect(fontSize).toBeDefined()
        expect(fontSize).toHaveProperty('3xl')
        expect(fontSize).toHaveProperty('2xl')
        expect(fontSize).toHaveProperty('xl')
        expect(fontSize).toHaveProperty('lg')
        expect(fontSize).toHaveProperty('md')
        expect(fontSize).toHaveProperty('base')
        expect(fontSize).toHaveProperty('sm')
        expect(fontSize).toHaveProperty('xs')
      })
      
      it('should have exact fontSize and lineHeight values', () => {
        expect(fontSize?.['3xl']).toEqual(['1.802rem', { lineHeight: '1.2' }])
        expect(fontSize?.['2xl']).toEqual(['1.602rem', { lineHeight: '1.2' }])
        expect(fontSize?.['xl']).toEqual(['1.424rem', { lineHeight: '1.2' }])
        expect(fontSize?.['lg']).toEqual(['1.266rem', { lineHeight: '1.3' }])
        expect(fontSize?.['md']).toEqual(['1.125rem', { lineHeight: '1.4' }])
        expect(fontSize?.['base']).toEqual(['1rem', { lineHeight: '1.4' }])
        expect(fontSize?.['sm']).toEqual(['0.889rem', { lineHeight: '1.5' }])
        expect(fontSize?.['xs']).toEqual(['0.790rem', { lineHeight: '1.5' }])
      })
    })
    
    describe('Color Tokens', () => {
      const colors = preset.theme?.extend?.colors
      
      it('should expose all semantic color keys', () => {
        expect(colors).toBeDefined()
        // Foreground
        expect(colors).toHaveProperty('fg')
        expect(colors).toHaveProperty('fg-muted')
        // Surfaces
        expect(colors).toHaveProperty('surface')
        expect(colors).toHaveProperty('elevated')
        expect(colors).toHaveProperty('muted')
        // Primary
        expect(colors).toHaveProperty('primary')
        expect(colors).toHaveProperty('primary-contrast')
        // Status
        expect(colors).toHaveProperty('success')
        expect(colors).toHaveProperty('warning')
        expect(colors).toHaveProperty('danger')
        // UI Elements
        expect(colors).toHaveProperty('border')
        expect(colors).toHaveProperty('ring')
        expect(colors).toHaveProperty('outline')
      })
      
      it('should use oklch with CSS variables', () => {
        expect(colors?.fg).toBe('oklch(var(--fg))')
        expect(colors?.primary).toBe('oklch(var(--primary))')
        expect(colors?.surface).toBe('oklch(var(--surface))')
        expect(colors?.border).toBe('oklch(var(--border))')
      })
    })
    
    describe('Font Weights', () => {
      const fontWeight = preset.theme?.extend?.fontWeight
      
      it('should expose semantic font weight keys', () => {
        expect(fontWeight).toBeDefined()
        expect(fontWeight).toHaveProperty('normal')
        expect(fontWeight).toHaveProperty('medium')
        expect(fontWeight).toHaveProperty('bold')
      })
      
      it('should have correct weight values', () => {
        expect(fontWeight?.normal).toBe('400')
        expect(fontWeight?.medium).toBe('500')
        expect(fontWeight?.bold).toBe('700')
      })
    })
  })
  
  describe('Styles Path', () => {
    it('should export atlasStylesPath', () => {
      expect(atlasStylesPath).toBeDefined()
      expect(typeof atlasStylesPath).toBe('string')
    })
    
    it('should resolve to an existing styles.css file', () => {
      expect(atlasStylesPath).toContain('styles.css')
      expect(existsSync(atlasStylesPath)).toBe(true)
    })
  })
  
  describe('No Spacing/Shadow Tokens', () => {
    const preset = atlasPreset()
    
    it('should not define custom spacing tokens', () => {
      expect(preset.theme?.extend?.spacing).toBeUndefined()
      expect(preset.theme?.extend?.gap).toBeUndefined()
    })
    
    it('should not define custom shadow tokens', () => {
      expect(preset.theme?.extend?.boxShadow).toBeUndefined()
      expect(preset.theme?.extend?.dropShadow).toBeUndefined()
    })
    
    it('should not define custom z-index tokens', () => {
      expect(preset.theme?.extend?.zIndex).toBeUndefined()
    })
  })
})