from ursina import *

app = Ursina()

# Create a 3D Entity (a cube)
cube = Entity(
    model='cube', 
    color=color.orange, 
    texture='white_cube',
    scale=(2, 2, 2)
)

# The update function runs every frame
def update():
    # Rotate the cube constantly
    cube.rotation_y += 40 * time.dt
    cube.rotation_x += 20 * time.dt
    
    # Basic movement control
    if held_keys['w']: cube.z += 5 * time.dt
    if held_keys['s']: cube.z -= 5 * time.dt

# Add a simple floor and a light source (sun)
Entity(model='plane', scale=10, texture='grass', rotation_x=90, y=-1)
Sky()

app.run()
