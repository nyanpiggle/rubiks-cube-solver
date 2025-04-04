# test_cube.py

# Assuming you're running this from the 'tests' directory
import sys
sys.path.append('..')  # Add the parent directory to Python's search path

from src.cube import Cube
import src.utils

def test_cube_rotation(moves, cube=Cube()):
	initial_state = cube.faces
	for move in moves:
		if move.startswith('-'):
			cube.rotate(move[1:],'anti_clockwise')
			print('turning',move[1:],'face anti clockwise')
		else:
			cube.rotate(move,'clockwise')
			print('turning',move,'face clockwise')
	cube.display_faces()
	if cube.is_solved(): return "solved"
	return "dang"
cube = Cube()
commands = []

for face in cube.attribute['face']:
	commands.append(face)
	commands.append('-'+face)


#commands.append('-front')

del commands[:]

#commands.append('front')
#commands.append('-front')
commands.append('right')
#commands.append('-back')


print("Testing cube rotation:")
print(test_cube_rotation(commands))
