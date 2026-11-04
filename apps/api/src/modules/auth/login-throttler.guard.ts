import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Brute-force protection for /auth/login, keyed by the target email.
 * (Keying by IP would be wrong here: with the BFF every request arrives from the web server's IP.)
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const body = req.body as { correo?: unknown } | undefined;
    return typeof body?.correo === 'string' ? `login:${body.correo.trim().toLowerCase()}` : 'login:anonymous';
  }
}
