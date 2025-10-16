<?php

namespace App\Http\Queries\API\Internal;

use App\Http\Filters\{
    FilterCreatedFrom,
    FilterCreatedTo,
    FilterDestination,
    FilterStatus,
    FilterTravelFrom,
    FilterTravelTo
};
use App\Http\Queries\WithAppendsQueryBuilder;
use App\Models\TravelOrder;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;

class TravelOrderQuery extends WithAppendsQueryBuilder
{
    public function __construct(Request $request)
    {
        $base = TravelOrder::query();

        if ($request->user() && ! $request->user()->is_admin) {
            $base->where('user_id', $request->user()->id);
        }

        parent::__construct($base);

        $this->allowedFilters([
            AllowedFilter::custom('status', new FilterStatus()),
            AllowedFilter::custom('destination', new FilterDestination()),
            AllowedFilter::custom('from', new FilterTravelFrom()),

            AllowedFilter::custom('to', new FilterTravelTo()),
            AllowedFilter::custom('created_from', new FilterCreatedFrom()),
            AllowedFilter::custom('created_to', new FilterCreatedTo()),
        ]);

        $this->defaultSort('-created_at');
        $this->allowedSorts(['created_at', 'departure_date', 'return_date', 'destination', 'status']);
    }
}
