/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/shared/ui/index.ts
 * Responsabilidade: Ponto de entrada canônico da API Pública do Design System (Bloco 2).
 *
 * Papel Arquitetural:
 * Ponto de contato canônico e único entre os componentes primitivos e as features/app.
 * Respeita a regra ARC-R05 (Shared Is Leaf Layer).
 * ==============================================================================
 */

// Tipos base e compartilhados
export type { VisualSize, FormFieldA11yProps } from './types';

// Componentes Primitivos e seus respectivos tipos
export { Button } from './button';
export type { ButtonProps, ButtonVariant } from './button';

export { Input } from './input';
export type { InputProps, TextInputType } from './input';

export { Select } from './select';
export type { SelectProps } from './select';

export { Panel } from './panel';
export type { PanelProps, PanelTag, PanelSurface, PanelPadding } from './panel';

export { Badge } from './badge';
export type { BadgeProps, BadgeTone } from './badge';

export { Icon } from './icon';
export type { IconProps, IconName } from './icon';
