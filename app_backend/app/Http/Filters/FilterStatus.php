<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class FilterStatus implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        return $query->where('status', $value);
    }
}
