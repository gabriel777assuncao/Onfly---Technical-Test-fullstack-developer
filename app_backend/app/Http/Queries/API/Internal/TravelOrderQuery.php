<?php

namespace App\Http\Queries\API\Internal;

use App\Http\Queries\WithAppendsQueryBuilder;
use App\Models\TravelOrder;
use Spatie\QueryBuilder\AllowedFilter;
use App\Http\Filters\{
    FilterDestination,
    FilterStatus,
    FilterTravelFrom,
    FilterTravelTo,
    FilterCreatedFrom,
    FilterCreatedTo
};

class TravelOrderQuery extends WithAppendsQueryBuilder
{
    public function __construct()
    {
        parent::__construct(
            TravelOrder::query()->where('user_id', auth()->id())
        );

        $this->allowedFilters([
            AllowedFilter::custom('status', new FilterStatus()),
            AllowedFilter::custom('destination', new FilterDestination()),
            AllowedFilter::custom('from', new FilterTravelFrom()),

            AllowedFilter::custom('to', new FilterTravelTo()),
            AllowedFilter::custom('created_from', new FilterCreatedFrom()),
            AllowedFilter::custom('created_to', new FilterCreatedTo()),
        ]);

        $this->allowedAppends(['user']);

        $this->defaultSort('-created_at');
        $this->allowedSorts(['created_at', 'departure_date', 'return_date', 'destination', 'status']);
    }
}
