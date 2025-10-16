<?php

namespace App\Notifications;

use App\Models\TravelOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TravelOrderStatusChangedNotification extends Notification
{
    use Queueable;

    public function __construct(public TravelOrder $order, public string $from, public string $to) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
//        dd('chegou aqui');
        return (new MailMessage)
            ->subject("Seu pedido de viagem foi {$this->to}")
            ->greeting("Olá, {$notifiable->name}")
            ->line("Pedido #{$this->order->id} — destino: {$this->order->destination}")
            ->line("Status: {$this->from} → {$this->to}")
            ->action('Ver pedido', url("/app/travel-orders/{$this->order->id}"))
            ->line('Qualquer dúvida, fale com o suporte.');
    }
}
