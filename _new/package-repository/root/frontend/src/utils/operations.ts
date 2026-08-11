/** Operation vocabulary utilities for plain English display. */

import { operationLabels, type OperationKey, type CategoryName } from './operationData';
import { operationCategories, categoryColors } from './operationCategories';
import { operationDescriptions } from './operationDescriptions';

/** Raw pipeline step from JSON command definitions. */
export interface PipelineStep {
  readonly op?: string;
  readonly operation?: string;
  readonly args?: Record<string, unknown>;
}

/** Formatted pipeline step for UI display. */
export interface FormattedStep {
  readonly operation: string;
  readonly label: string;
  readonly description: string;
  readonly category: string;
  readonly categoryColor: string;
  readonly args: Record<string, unknown>;
}

/**
 * Get a human-readable label for an operation.
 * @param operation - The operation key
 * @returns Human-readable label
 */
export function getOperationLabel(
  operation: string,
): string {
  return operationLabels[
    operation as OperationKey
  ] ?? operation;
}

/**
 * Get a description for an operation.
 * @param operation - The operation key
 * @returns Human-readable description
 */
export function getOperationDescription(
  operation: string,
): string {
  return operationDescriptions[
    operation as OperationKey
  ] ?? 'No description available';
}

/**
 * Get the category for an operation.
 * @param operation - The operation key
 * @returns Category name string
 */
export function getOperationCategory(
  operation: string,
): string {
  return operationCategories[
    operation as OperationKey
  ] ?? 'Other';
}

/**
 * Get the hex color for a category.
 * @param category - The category name
 * @returns Hex color code string
 */
export function getCategoryColor(
  category: string,
): string {
  return categoryColors[
    category as CategoryName
  ] ?? '#95a5a6';
}

/**
 * Format a pipeline step for display.
 * @param step - The raw pipeline step object
 * @returns Formatted step with label, description, etc.
 */
export function formatPipelineStep(
  step: PipelineStep,
): FormattedStep {
  const operation = step.op ?? step.operation ?? '';
  const category = getOperationCategory(operation);
  return {
    operation,
    label: getOperationLabel(operation),
    description: getOperationDescription(operation),
    category,
    categoryColor: getCategoryColor(category),
    args: step.args ?? {},
  };
}
