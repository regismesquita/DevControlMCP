/**
 * Utility functions for shell command escaping
 */

/**
 * Escapes a shell argument to prevent injection attacks and handle special characters.
 * 
 * @param arg - The argument to escape
 * @returns The escaped argument safe for shell execution
 * 
 * @remarks
 * This function wraps arguments containing special characters in double quotes
 * and escapes internal quotes, dollar signs, and backticks to prevent:
 * - Command injection
 * - Variable expansion
 * - Command substitution
 * - Glob expansion
 * - Other shell interpretation issues
 * 
 * Special characters that trigger quoting:
 * - Whitespace: space, tab, newline
 * - Quotes: single (') and double (")
 * - Shell metacharacters: $, `, \, !, *, ?, #
 * - Command separators: ;, &, |
 * - Redirects: <, >
 * - Grouping: (, ), {, }, [, ]
 * 
 * @example
 * ```typescript
 * escapeShellArg('hello world') // Returns: "hello world"
 * escapeShellArg('$HOME') // Returns: "$HOME" (with escaped $)
 * escapeShellArg('normal-arg') // Returns: normal-arg
 * ```
 */
export function escapeShellArg(arg: string): string {
  // If arg contains special characters, wrap in quotes and escape internal quotes
  if (/[\s"'\\$`!*?#(){}[\]<>|;&]/.test(arg)) {
    // Escape characters that have special meaning inside double quotes
    // We need to escape: " \ $ `
    return `"${arg.replace(/["\\$`]/g, '\\$&')}"`;
  }
  return arg;
}

/**
 * Escapes an array of shell arguments
 * 
 * @param args - Array of arguments to escape
 * @returns Array of escaped arguments
 */
export function escapeShellArgs(args: string[]): string[] {
  return args.map(escapeShellArg);
}

/**
 * Builds a safe shell command from components
 * 
 * @param executable - The executable path
 * @param args - Array of arguments
 * @param options - Optional command building options
 * @returns The complete escaped command string
 */
export function buildShellCommand(
  executable: string,
  args: string[],
  options?: {
    workingDirectory?: string;
  }
): string {
  const escapedExecutable = escapeShellArg(executable);
  const escapedArgs = escapeShellArgs(args);
  
  let command = '';
  
  // Add working directory change if specified
  if (options?.workingDirectory) {
    command = `cd ${escapeShellArg(options.workingDirectory)} && `;
  }
  
  command += `${escapedExecutable} ${escapedArgs.join(' ')}`;
  
  return command;
}