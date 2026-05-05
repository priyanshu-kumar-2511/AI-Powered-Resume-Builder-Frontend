import { resolveTemplateFallback } from './template-fallbacks';
import { Template } from '../models/models';

describe('Template Fallbacks Resolver', () => {

  it('should return null if template is null or undefined', () => {
    expect(resolveTemplateFallback(null)).toBeNull();
    expect(resolveTemplateFallback(undefined)).toBeNull();
  });

  it('should resolve by templateId', () => {
    const mockTemplate: Partial<Template> = { templateId: 1, name: 'Random Name' };
    const result = resolveTemplateFallback(mockTemplate as Template);
    expect(result).not.toBeNull();
    expect(result?.templateId).toBe(1);
    expect(result?.name).toBe('Classic ATS');
  });

  it('should resolve by name (case-insensitive) if ID does not match', () => {
    const mockTemplate: Partial<Template> = { templateId: 999, name: 'MODERN SIDEBAR' };
    const result = resolveTemplateFallback(mockTemplate as Template);
    expect(result).not.toBeNull();
    expect(result?.templateId).toBe(3);
    expect(result?.name).toBe('Modern Sidebar');
  });

  it('should return null if neither ID nor name matches', () => {
    const mockTemplate: Partial<Template> = { templateId: 999, name: 'Non Existent' };
    const result = resolveTemplateFallback(mockTemplate as Template);
    expect(result).toBeNull();
  });

  it('should resolve Corporate Clean by name', () => {
    const mockTemplate: Partial<Template> = { name: 'corporate clean' };
    const result = resolveTemplateFallback(mockTemplate as Template);
    expect(result).not.toBeNull();
    expect(result?.templateId).toBe(2);
  });
});
