<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BranchScopeMiddleware
{
    /**
     * Restrict admin_cabang to only see data from their branch.
     * Sets a 'branch_scope_id' attribute on the request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role === 'admin_cabang') {
            $request->attributes->set('branch_scope_id', $user->branch_id);
        }

        return $next($request);
    }
}
