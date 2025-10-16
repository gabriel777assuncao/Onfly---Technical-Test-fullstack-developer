<?php

namespace App\Notifications;

use App\Models\TravelOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TravelOrderStatusChangedNotification extends Notification
{
    use Queueable;

    public function __construct(public TravelOrder $order, public string $oldStatus, public string $newStatus) {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Seu pedido de viagem foi {$this->newStatus}")
            ->greeting("Olá, {$notifiable->name}")
            ->line("Pedido #{$this->order->id} — destino: {$this->order->destination}")
            ->line("Status: {$this->oldStatus} → {$this->newStatus}")
            ->action('Ver pedido', url("/app/travel-orders/{$this->order->id}"))
            ->line('Qualquer dúvida, fale com o suporte.');
    }
}
