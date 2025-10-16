<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class FilterTravelTo implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        return $query->whereDate('return_date', '<=', $value);
    }
}
