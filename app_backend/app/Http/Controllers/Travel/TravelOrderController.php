<?php

namespace App\Http\Controllers\Travel;

use App\Http\Controllers\Controller;
use App\Http\Queries\API\Internal\TravelOrderQuery;
use App\Http\Requests\Travel\{StoreRequest, UpdateRequest};
use App\Http\Resources\TravelOrderResource;
use App\Jobs\SendTravelOrderStatus;
use App\Models\TravelOrder;
use App\Services\TravelOrderStatusServices;
use App\TravelOrderStatus;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\{JsonResponse, Request};
use Symfony\Component\HttpFoundation\Response;

class TravelOrderController extends Controller
{
    use AuthorizesRequests;

    public function store(StoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $travelOrder = auth()->user()
            ->travelOrders()
            ->create($data)->refresh();

        return response()->json(
            [
                'message' => __('messages.order.created'),
                'data' => TravelOrderResource::make($travelOrder),
            ],
            Response::HTTP_CREATED,
        );
    }

    public function show(TravelOrder $travelOrder): JsonResponse
    {
        $this->authorize('view', $travelOrder);

        return response()->json([
            'data' => TravelOrderResource::make($travelOrder),
        ]);
    }

    public function index(Request $request, TravelOrderQuery $query): JsonResponse
    {
        $this->authorize('viewAny', TravelOrder::class);

        if (! $request->user()->is_admin) {
            $query->where('user_id', $request->user()->id);
        }

        $paginator = $query->paginate(
            perPage: (int) ($request->input('page.size', 15))
        )->appends($request->query());

        return response()->json(
            TravelOrderResource::collection($paginator)->response()->getData(true),
            Response::HTTP_OK,
        );
    }

    public function updateStatus(
        UpdateRequest $request,
        TravelOrder $travelOrder,
        TravelOrderStatusServices $travelService,
    ): JsonResponse {
        $this->authorize('approve', $travelOrder);

        $oldStatus = $travelOrder->status;
        $newStatus = TravelOrderStatus::from($request->validated('status'));

        $travelOrder = $travelService->change($travelOrder, $newStatus);

        SendTravelOrderStatus::dispatch($travelOrder, $oldStatus->value, $newStatus->value)->afterCommit();

        return response()->json([
            'message' => __('messages.updated'),
            'data' => TravelOrderResource::make($travelOrder),
        ]);
    }
}
