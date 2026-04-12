<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = Auth::user();

        if ($user && $user->role === $role) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return new JsonResponse([
                'message' => 'You do not have permission to access this area.',
            ], 403);
        }

        if ($user) {
            return redirect($user->role === 'viewer' ? '/viewer' : '/admin')
                ->with('auth_error', 'You do not have permission to access that page.');
        }

        return redirect('/login');
    }
}
