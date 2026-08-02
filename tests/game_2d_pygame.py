import pygame

# Initialize Pygame
pygame.init()
screen = pygame.display.set_mode((400, 300))
clock = pygame.time.Clock()
running = True

# Player properties
player_pos = [200, 150]

while running:
    # 1. Event Handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # 2. Logic (Input)
    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:  player_pos[0] -= 5
    if keys[pygame.K_RIGHT]: player_pos[0] += 5
    if keys[pygame.K_UP]:    player_pos[1] -= 5
    if keys[pygame.K_DOWN]:  player_pos[1] += 5

    # 3. Rendering
    screen.fill((30, 30, 30))  # Clear screen with dark grey
    pygame.draw.rect(screen, (255, 0, 0), (player_pos[0], player_pos[1], 40, 40))
    
    pygame.display.flip()
    clock.tick(60) # 60 FPS

pygame.quit()
