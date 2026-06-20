<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,name,email,role')->latest();

        if ($request->has('entity_type')) $query->where('entity_type', $request->entity_type);
        if ($request->has('entity_id')) $query->where('entity_id', $request->entity_id);
        if ($request->has('user_id')) $query->where('user_id', $request->user_id);
        if ($request->has('action')) $query->where('action', $request->action);
        if ($request->has('from')) $query->where('created_at', '>=', $request->from);
        if ($request->has('to')) $query->where('created_at', '<=', $request->to);

        return response()->json($query->paginate(50));
    }
}
