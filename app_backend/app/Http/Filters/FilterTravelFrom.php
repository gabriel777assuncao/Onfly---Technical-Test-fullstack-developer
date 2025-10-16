<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class FilterTravelFrom implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        return $query->whereDate('departure_date', '>=', $value);
    }
}
