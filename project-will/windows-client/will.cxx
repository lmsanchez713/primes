#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <stdio.h>

// --- Constants for Window and Screen ---
const int SCREEN_WIDTH = 800;
const int SCREEN_HEIGHT = 600;
const char* WINDOW_TITLE = "Wooden Game Menu";

// --- Asset Paths (Adjust these to match your saved filenames) ---
const char* BACKGROUND_PATH = "C:\\primes\\project-will\\windows-client\\Ivory_BG.png";
const char* PLAQUE_PATH = "C:\\primes\\project-will\\windows-client\\PLAQUEWoodenSign.png";
const char* BUTTON_FILES[] = {
    "C:\\primes\\project-will\\windows-client\\Button.png", // New Game
    "C:\\primes\\project-will\\windows-client\\Button.png", // Load Game
    "C:\\primes\\project-will\\windows-client\\Button.png", // Options
    "C:\\primes\\project-will\\windows-client\\Button.png"  // Exit
};

// --- Global Pointers and Structures ---
SDL_Window* window = NULL;
SDL_Renderer* renderer = NULL; 
SDL_Texture* background_tex = NULL;
SDL_Texture* plaque_tex = NULL;
SDL_Texture* buttons[4] = { NULL }; // Array to hold button textures

// Define the clickable areas (These coordinates MUST be adjusted based on your image layout)
// Format: {x, y, w, h}
SDL_Rect button_rects[4] = {
    {50, 250, 200, 50},  // New Game
    {50, 310, 200, 50},  // Load Game
    {50, 370, 200, 50},  // Options
    {50, 430, 200, 50}   // Exit
};


// --- Function Prototypes ---
int initialize_sdl();
int load_assets();
void render(SDL_Renderer* renderer, SDL_Texture* bg, SDL_Texture* plaque, SDL_Texture* b[]);
void handle_events(SDL_Event* event);
void cleanup();

int main(int argc, char* argv[]) {
    if (initialize_sdl() != 0) {
        fprintf(stderr, "SDL Initialization failed!\n");
        return 1;
    }

    if (load_assets() != 0) {
        fprintf(stderr, "Asset Loading failed! Check if image files exist.\n");
        cleanup();
        return 1;
    }

    // --- Main Application Loop ---
    SDL_Event event;
    int running = 1;

    while (running) {
        // 1. Event Handling
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
                running = 0;
            }
            // Check for Mouse Click events
            else if (event.type == SDL_MOUSEBUTTONDOWN) {
                int mouse_x = event.button.x;
                int mouse_y = event.button.y;

                // Check if the click was within any button area
                for (int i = 0; i < 4; i++) {
                    SDL_Rect btn_rect = button_rects[i];
                    if (mouse_x >= btn_rect.x && mouse_x <= btn_rect.x + btn_rect.w &&
                        mouse_y >= btn_rect.y && mouse_y <= btn_rect.y + btn_rect.h) {

                        printf("Button %d clicked! Action: ", i + 1);

                        // --- CORE LOGIC: Handle Exit Button ---
                        if (i == 3) { // If the 4th button (index 3) is clicked, exit the application
                            printf("Exiting Application...\n");
                            running = 0;
                        }
                        else {
                            // Handle other buttons here (e.g., load game, open options)
                            // For now, we'll just print a message
                            if (i == 0) printf("New Game selected.\n");
                            else if (i == 1) printf("Load Game selected.\n");
                            else if (i == 2) printf("Options selected.\n");
                        }
                        break; // Stop checking other buttons once one is clicked
                    }
                }
            }
        }

        // 2. Rendering
        render(renderer, background_tex, plaque_tex, buttons);
    }

    // --- Cleanup ---
    cleanup();
    printf("Application closed successfully.\n");

    return 0;
}


// --- Function Definitions ---

int initialize_sdl() {
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        fprintf(stderr, "SDL could not be initialized: %s\n", SDL_GetError());
        return -1;
    }

    // Initialize SDL_image for PNG support
    int img_flags = IMG_INIT_PNG;
    if (!(IMG_Init(img_flags) & img_flags)) {
        fprintf(stderr, "SDL_image could not initialize! SDL_image Error: %s\n", IMG_GetError());
        return -1;
    }

    window = SDL_CreateWindow(WINDOW_TITLE,
        SDL_WINDOWPOS_UNDEFINED,
        SDL_WINDOWPOS_UNDEFINED,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        SDL_WINDOW_SHOWN);
    if (window == NULL) {
        fprintf(stderr, "Window could not be created: %s\n", SDL_GetError());
        return -1;
    }
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    if (renderer == NULL) {
        fprintf(stderr, "Renderer could not be created: %s\n", SDL_GetError());
        return -1;
    }

    // Set renderer draw to use the background color immediately
    SDL_SetRenderDrawColor(renderer, 0x00, 0x00, 0x00, 0xFF); // Black clear color
    return 0;
}

int load_assets() {
    // 1. Load Background
    background_tex = IMG_LoadTexture(renderer, BACKGROUND_PATH);
    if (background_tex == NULL) {
        fprintf(stderr, "Failed to load background texture: %s\n", IMG_GetError());
        return -1;
    }

    // 2. Load Plaque (Assuming it will be drawn on top of the background)
    plaque_tex = IMG_LoadTexture(renderer, PLAQUE_PATH);
    if (plaque_tex == NULL) {
        fprintf(stderr, "Failed to load plaque texture: %s\n", IMG_GetError());
        return -1;
    }

    // 3. Load Buttons
    for (int i = 0; i < 4; i++) {
        buttons[i] = IMG_LoadTexture(renderer, BUTTON_FILES[i]);
        if (buttons[i] == NULL) {
            fprintf(stderr, "Failed to load button texture %s: %s\n", BUTTON_FILES[i], IMG_GetError());
            return -1;
        }
    }

    printf("Assets loaded successfully.\n");
    return 0;
}


void render(SDL_Renderer* renderer, SDL_Texture* bg, SDL_Texture* plaque, SDL_Texture* b[]) {
    // Clear screen with background color
    SDL_SetRenderDrawColor(renderer, 0x30, 0x30, 0x30, 0xFF); // Dark gray for menu
    SDL_RenderClear(renderer);

    // Draw Background
    SDL_RenderCopy(renderer, bg, NULL, NULL);

    // Draw Plaque (Sign) on top of the background
    if (plaque) {
        SDL_RenderCopy(renderer, plaque, NULL, NULL);
    }

    // Draw Buttons (for visualization purposes)
    for (int i = 0; i < 4; i++) {
        if (b[i]) {
            // Draw the button texture at its defined location
            SDL_Rect dest = button_rects[i];
            SDL_RenderCopy(renderer, b[i], NULL, &dest);
        }
    }

    // Update screen
    SDL_RenderPresent(renderer);
}


void cleanup() {
    if (background_tex) SDL_DestroyTexture(background_tex);
    if (plaque_tex) SDL_DestroyTexture(plaque_tex);
    for (int i = 0; i < 4; i++) {
        if (buttons[i]) SDL_DestroyTexture(buttons[i]);
    }
    if (renderer) SDL_DestroyRenderer(renderer);
    if (window) SDL_DestroyWindow(window);
    IMG_Quit();
    SDL_Quit();
}
