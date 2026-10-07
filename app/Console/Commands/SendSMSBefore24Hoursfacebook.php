<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\SocialiteController;
use App\Models\Post;


class SendSMSBefore24Hoursfacebook extends Command
{
     /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sms:before24hoursfb';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send SMS before 24 hours for scheduled events';

    /**
     * Execute the console command.
     */

     public function __construct()
     {
         parent::__construct();
     }
 
    public function handle()
    {
        //
        $controller = new SocialiteController();
        $eventsWithin24Hours = $controller->getEventsWithin24Hours();

        foreach ($eventsWithin24Hours as $event) {
            // Envoyer un SMS pour chaque événement
            $controller->getsms($event->receiver_number, $event->message, $event->scheduledDateTime);
        }
}
}