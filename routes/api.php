<?php

use App\Http\Controllers\AuthController;

use App\Http\Controllers\DataExtraction;
use App\Http\Controllers\DraftController;
use App\Http\Controllers\PostSchedulerController;
use App\Http\Controllers\SocialiteController;
use App\Http\Controllers\PosteController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NewPasswordController;
use App\Http\Controllers\LocataireController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\FicheSuiviController;
use App\Http\Controllers\StationController;
use App\Http\Controllers\FamilleController;
use App\Http\Controllers\SousfamController;
use App\Http\Controllers\LocatairesController;
use App\Http\Controllers\TestCodeController;
use App\Http\Controllers\ContratController;
use App\Http\Controllers\FacturationController;
use App\Http\Controllers\FichelocController;
use App\Http\Controllers\FacturesController;
use App\Http\Controllers\PatrimoineController;
use App\Http\Controllers\ReglementController;


// 

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/







//Route::post('/publication', [SocialiteController::class, 'handleGraphInteraction']);
//Route::post('/planification', [PostSchedulerController::class, 'schedulePost']);
Route::get('/index', [SocialiteController::class, 'index']);
Route::get('/extractFacebookData', [DataExtraction::class, 'extractFacebookData']);
Route::put('/updatePlanification/{id}', [SocialiteController::class, 'updatePlanification']);
Route::get('/facebook-data', [DataExtraction::class, 'extractFacebookData']);
//Route::post('/saveDraft', [DraftController::class, 'saveDraft']);

Route::middleware('auth:sanctum')->post('/saveDraft', [DraftController::class, 'saveDraft']);

Route::middleware('auth:sanctum')->post('/publication', [SocialiteController::class, 'handleGraphInteraction']);

Route::middleware('auth:sanctum')->post('/planification', [PostSchedulerController::class, 'schedulePost']);

Route::middleware('auth:sanctum')->post('/instagram', [PosteController::class, 'planificationfinal2']);

//genereria
Route::post('genereria', [PosteController::class, 'genereria'])->name('genereria');

Route::middleware('auth:sanctum')->get('/images', [PosteController::class, 'index']);

Route::get('imagesadm', [PosteController::class, 'indexadm'])->name('imagesadm');

Route::middleware('auth:sanctum')->get('/imagesplanif', [PosteController::class, 'planifies']);
Route::get('imagesplaniftest', [PosteController::class, 'planifiestesttt'])->name('imagesplaniftest');
Route::get('imagesdrafttest', [PosteController::class, 'drafttesttt'])->name('imagesdrafttest');
Route::get('imagespubliertest', [PosteController::class, 'publiertesttt'])->name('imagespubliertest');
Route::get('showparid/{id}', [PosteController::class, 'showid']);
Route::middleware('auth:sanctum')->put('plandraft/{post_id}', [PosteController::class, 'scheduleDraft']);
Route::middleware('auth:sanctum')->put('pubdraft/{post_id}', [PosteController::class, 'publishDraft']);



Route::get('sms', [PosteController::class, 'getsms'])->name('sms');
Route::get('email', [PosteController::class, 'email'])->name('email');
//Route::put('imagesplanif/{post}', [PosteController::class, 'update'])->name('imagesplanif');
Route::middleware('auth:sanctum')->put('imagesplanif/{post}', [PosteController::class, 'update']);
Route::get('/post/{postId}', [PosteController::class, 'show']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/auth', [AuthController::class, 'auth']);
   // Route::get('/imagesplanif', [PosteController::class, 'planifies']);


  //Route::get('/dashboard', [DashboardController::class, 'index']);
});

Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/email', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/reset', [AuthController::class, 'reset']);


Route::post('forgot-password', [NewPasswordController::class, 'forgotPassword']);
Route::post('reset-password', [NewPasswordController::class, 'reset']);


Route::middleware('auth:sanctum')->post('/update-pwd', [AuthController::class, 'changePassword']);
Route::middleware('auth:sanctum')->post('/update-profile', [AuthController::class, 'updateProfile']);

Route::middleware('auth:sanctum')->get('/user-profile', [AuthController::class, 'userProfile']);


// LISTE (filtres optionnels: ?locataire=&station=&operationnel=OUI)
Route::middleware('auth:sanctum')->get('locataires', [LocataireController::class, 'index'])
    ->name('locataires.index');

// AFFICHER par ID
Route::middleware('auth:sanctum')->get('locataires/{id}', [LocataireController::class, 'show'])
    ->name('locataires.show');

Route::post('locataires', [LocataireController::class, 'store'])->name('locataires.store'); // <-- ajout public

Route::middleware('auth:sanctum')->match(['put','patch'], 'locataires/{id}', [LocataireController::class, 'update'])->name('locataires.update');

Route::middleware('auth:sanctum')->delete('locataires/{id}', [LocataireController::class, 'destroy'])
    ->name('locataires.destroy');



    Route::apiResource('tenants', TenantController::class);

    
// Fiches d'un locataire (imbriquées)
Route::get('/tenants/{tenant}/fiches', [FicheSuiviController::class, 'index']);
Route::post('/tenants/{tenant}/fiches', [FicheSuiviController::class, 'store']);

// Fiche spécifique
Route::get('/fiches/{fiche}', [FicheSuiviController::class, 'show']);
Route::put('/fiches/{fiche}', [FicheSuiviController::class, 'update']);
Route::delete('/fiches/{fiche}', [FicheSuiviController::class, 'destroy']);













// CRUD Stations
Route::get('/stations', [StationController::class, 'index']);
Route::post('/stations', [StationController::class, 'store']);
Route::get('/stations/{id}', [StationController::class, 'show']);
Route::put('/stations/{id}', [StationController::class, 'update']);
Route::delete('/stations/{id}', [StationController::class, 'destroy']);

// CRUD Familles
Route::get('/familles', [FamilleController::class, 'indexf']);
Route::post('/familles', [FamilleController::class, 'storef']);
Route::get('/familles/{id}', [FamilleController::class, 'showf']);
Route::put('/familles/{id}', [FamilleController::class, 'updatef']);
Route::delete('/familles/{id}', [FamilleController::class, 'destroyf']);


// CRUD sousfam
Route::get('/sousfams', [SousfamController::class, 'indexsf']);
Route::post('/sousfams', [SousfamController::class, 'storesf']);
Route::get('/sousfams/{id}', [SousfamController::class, 'showsf']);
Route::put('/sousfams/{id}', [SousfamController::class, 'updatesf']);
Route::delete('/sousfams/{id}', [SousfamController::class, 'destroysf']);



Route::middleware('auth:sanctum')->get('/patrimoines', [PatrimoineController::class, 'index']);
Route::middleware('auth:sanctum')->post('/patrimoines', [PatrimoineController::class, 'store']);
Route::middleware('auth:sanctum')->get('/patrimoines/{id}', [PatrimoineController::class, 'show']);
Route::middleware('auth:sanctum')->put('/patrimoines/{id}', [PatrimoineController::class, 'update']);
Route::middleware('auth:sanctum')->delete('/patrimoines/{id}', [PatrimoineController::class, 'destroy']);





Route::get('/generate-code', [TestCodeController::class, 'generate']);


Route::get('/contrats/alerts', [ContratController::class, 'alerts']);

Route::apiResource('contrats', ContratController::class);

/*
Route::post('/facturation/preview', [FacturationController::class, 'preview']);
Route::post('/facturation/pdf', [FacturationController::class, 'generatePdf']);
*/





Route::get('/fichelocs', [FichelocController::class, 'index']);
Route::post('/fichelocs', [FichelocController::class, 'store']);
Route::get('/fichelocs/{id}', [FichelocController::class, 'show']);
Route::put('/fichelocs/{id}', [FichelocController::class, 'update']);
Route::delete('/fichelocs/{id}', [FichelocController::class, 'destroy']);

// ✅ Route utilisée par le frontend popup
Route::get('/locataires/{locataire}/ficheloc', [FichelocController::class, 'showByLocataire']);





/************************ 
hedhom kenou yemchiw 9ball stockage
Route::post('/facturation/calculate', [FacturationController::class, 'calculate']);
Route::post('/facturation/pdf', [FacturationController::class, 'pdf']);

*/


Route::get('/factures/stats', [FacturationController::class, 'stats']);

Route::post('/facturation/calculate', [FacturationController::class, 'calculate']);

// ✅ nouveau: stocker au moment d’imprimer
Route::post('/facturation/store', [FacturationController::class, 'store']);

// (optionnel) récupérer facture + lignes
Route::get('/factures/{id}', [FacturationController::class, 'show']);



Route::get('/factures', [FacturesController::class, 'index']);      // liste + filtres
Route::get('/factures/{id}', [FacturationController::class, 'show']);  // détail


Route::put('/factures/{id}', [FacturationController::class,'update']);
Route::delete('/factures/{id}', [FacturationController::class,'destroy']);



Route::post('/factures/regrouper', [FacturationController::class, 'regrouperFactures']);

// ===================== Gestion des règlements de factures =====================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/reglements/factures-disponibles', [ReglementController::class, 'facturesDisponibles']);
    Route::get('/reglements/alertes', [ReglementController::class, 'alertes']);
    Route::get('/reglements/analytics', [ReglementController::class, 'analytics']);
    Route::put('/reglements/{id}/traiter', [ReglementController::class, 'traiter']);

    Route::get('/reglements', [ReglementController::class, 'index']);
    Route::post('/reglements', [ReglementController::class, 'store']);
    Route::get('/reglements/{id}', [ReglementController::class, 'show']);
    Route::put('/reglements/{id}', [ReglementController::class, 'update']);
    Route::delete('/reglements/{id}', [ReglementController::class, 'destroy']);
});

