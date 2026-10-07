<?php

namespace App\Http\Controllers;

use App\Models\Insight;
use Illuminate\Support\Str;
use App\Models\Post;
use App\Services\SnapchatClient;
use Exception;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Facebook\Facebook;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DataExtraction extends Controller {
   
    public function extractFacebookData()
    {
        $fb = new \Facebook\Facebook([
            'app_id' => '262461340879731',
            'app_secret' => '19ffda7dd225fdae36cc87ad161f4297',
            'default_graph_version' => 'v12.0',
        ]);

        try {
            $pageId = '287659024435386';
            $accessToken = 'EAADutQr9i3MBO8xcVVwfo6Iupd1GYL5DZBeJYolyitLkUnGV4VXfCKl5gBAMUM7LtWMsEYby8u6N9kdc73q24h65nFXCmUymf0b3tNYMjZAs0ZAyOZAiZC1uE5M38KsFwK4JDVMfWgWhqxsJX2F9YNeV9ewELZCZBJD5jY0yV7i0AD1JDbUpTzYOsdP1WNuTS7r';

            $today = now()->toDateString(); // Get current date in 'YYYY-MM-DD' format
            $facebookUrl = 'https://graph.facebook.com/v19.0/' . $pageId . '/insights?metric=page_posts_impressions,page_follows&period=day&since=' . $today . '&until=' . $today . '&access_token=' . $accessToken;

            Log::info('Sending request to Facebook API: ' . $facebookUrl);

            $response = Http::get($facebookUrl);
            $facebookData = $response->json();

            Log::info('Response from Facebook API: ', $facebookData);

            if (isset($facebookData['data'])) {
                $impressions = null;
                $reactions_like_total = null;

                foreach ($facebookData['data'] as $insight) {
                    if ($insight['name'] === 'page_posts_impressions') {
                        $impressions = array_sum(array_column($insight['values'], 'value'));
                    }
                    if ($insight['name'] === 'page_follows') {
                        $reactions_like_total = array_sum(array_column($insight['values'], 'value'));
                    }
                }

                if ($impressions !== null || $reactions_like_total !== null) {
                    Insight::create([
                        'name' => 'Facebook Insights',
                        'period' => 'day',
                        'impressions_tot' => $impressions,
                        'reactions_like_total' => $reactions_like_total,
                        'title' => 'Daily Facebook Insights',
                        'description' => 'Impressions and likes for the day ' . $today,
                    ]);

                    Log::info('Data successfully stored.');

                    return response()->json(['message' => 'Data successfully stored.']);
                } else {
                    Log::error('No relevant insight data found.');
                    return response()->json(['error' => 'No relevant insight data found.'], 404);
                }
            } else {
                Log::error('No insight data found.');
                return response()->json(['error' => 'No insight data found.'], 404);
            }

        } catch (\Facebook\Exceptions\FacebookResponseException $e) {
            Log::error('Graph returned an error: ' . $e->getMessage());
            return response()->json(['error' => 'Graph returned an error: ' . $e->getMessage()], 500);
        } catch (\Facebook\Exceptions\FacebookSDKException $e) {
            Log::error('Facebook SDK returned an error: ' . $e->getMessage());
            return response()->json(['error' => 'Facebook SDK returned an error: ' . $e->getMessage()], 500);
        } catch (Exception $e) {
            Log::error('Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
        }
        
    }


//prendre du data tu table index sous forme json
    public function index()
{
    $insights = Insight::select('created_at', 'impressions_tot', 'reactions_like_total')->get();

    // Format the created_at attribute and return only necessary fields
    $formattedInsights = $insights->map(function ($insight) {
        return [
            'created_at' => $insight->created_at->format('d M Y'),
            'impressions_tot' => $insight->impressions_tot,
            'reactions_like_total' => $insight->reactions_like_total,
        ];
    });

    return response()->json($formattedInsights);
}





}