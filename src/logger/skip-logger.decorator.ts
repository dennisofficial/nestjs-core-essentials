import { SetMetadata } from '@nestjs/common';
import { SKIP_REQUEST_LOGGING_METADATA } from './metadata';

export const SkipLogger = () => SetMetadata<symbol, boolean>(SKIP_REQUEST_LOGGING_METADATA, true);
