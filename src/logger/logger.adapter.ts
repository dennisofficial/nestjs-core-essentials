import { ConsoleLogger, LogLevel } from '@nestjs/common';

export class LoggerAdapter extends ConsoleLogger {
  private isTimestamp: boolean = false;
  private isColored: boolean = false;

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    _: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    if (contextMessage.includes('InstanceLoader')) {
      return '';
    }

    if (contextMessage.includes('RouterExplorer')) {
      contextMessage += ' > ';
    }

    const output = this.stringifyMessage(message, logLevel);
    formattedLogLevel = this.colorize(formattedLogLevel.trim().padEnd(7, ' '), logLevel);

    let prefix = '';

    if (this.isTimestamp) {
      prefix = `${this.getTimestamp()} - `;
    }

    const logMessage = `${prefix}${formattedLogLevel} ${contextMessage}${output}${timestampDiff}\n`;

    if (message instanceof Object) {
      console.dir(message, { depth: null });
      return '';
    }

    return logMessage;
  }

  showTimestamp = () => {
    this.isTimestamp = true;
  };

  showColor = () => {
    this.isColored = true;
  };

  protected colorize(message: string, logLevel: LogLevel): string {
    if (this.isColored) {
      return super.colorize(message, logLevel);
    }
    return message;
  }

  protected formatContext(context: string): string {
    if (this.isColored) {
      return super.formatContext(context);
    }
    return `[${context}] `;
  }

  protected formatTimestampDiff(timestampDiff: number): string {
    if (this.isColored) {
      return super.formatTimestampDiff(timestampDiff);
    }
    return ` +${timestampDiff}ms`;
  }
}
