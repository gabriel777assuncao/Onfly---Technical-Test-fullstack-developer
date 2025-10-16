<?php

namespace App\Http\Controllers\Travel;

use App\Http\Controllers\Controller;
use App\Http\Queries\API\Internal\TravelOrderQuery;
use App\Http\Requests\Travel\StoreRequest;
use App\Http\Resources\TravelOrderResource;
use App\Models\TravelOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TravelOrderController extends Controller
{
    public function store(StoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $travelOrder = auth()->user()
            ->travelOrders()
            ->create($data);

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
        return response()->json(
            TravelOrderResource::make($travelOrder),
            Response::HTTP_OK,
        );
    }

    public function index(Request $request, TravelOrderQuery $query): JsonResponse
    {
        $paginator = $query->paginate(
            perPage: (int)($request->input('page.size', 15))
        )->appends($request->query());

        return response()->json(
            TravelOrderResource::collection($paginator)->response()->getData(true),
            Response::HTTP_OK
        );
    }
}
