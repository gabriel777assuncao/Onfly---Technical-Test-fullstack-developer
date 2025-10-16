<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\Filters\Filter;

class FilterDestination implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        return $query->whereRaw('LOWER(destination) LIKE ?', ['%'.Str::lower($value).'%']);
    }
}
