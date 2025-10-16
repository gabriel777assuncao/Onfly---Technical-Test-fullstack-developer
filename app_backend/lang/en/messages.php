<?php

return [
    'success' => 'Operation completed successfully.',
    'error' => 'An error occurred while processing your request.',
    'not_found' => 'The requested resource was not found.',
    'invalid_data' => 'The provided data is invalid.',
    'created' => ':resource has been created successfully.',
    'updated' => ':resource has been updated successfully.',
    'deleted' => ':resource has been deleted successfully.',
    'order' => [
        'created' => 'Your order has been created successfully.',
        'updated' => 'Your order has been updated successfully.',
        'deleted' => 'Your order has been deleted successfully.',
        'not_found' => 'Order not found.',
        'processing' => 'Your order is being processed.',
        'completed' => 'Your order has been completed.',
        'cancelled' => 'Your order has been cancelled.'
    ],

    'travel_order' => [
        'transition' => [
            'not_allowed_after_approved' => 'Não é permitido cancelar um pedido já aprovado.',
            'invalid' => 'Transição inválida: :from → :to.',
            'concurrency' => 'O status foi alterado por outro processo. Tente novamente.',
        ],
    ],
];
