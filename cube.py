import sys
sys.path.append('/storage/emulated/0/Documents/Pydroid3/rubiks-cube-solver/src')
from utils import transpose, reverse, rotate_matrix, copy, display_coloured_row, chain_rotation, modmaths
from utils import copy_row as row
from utils import copy_column as col

class Cube:
	# the size of cube class
	size = 3
	# Class variables for ANSI color codes
	WHITE = '\033[97m'
	ORANGE = '\033[38;5;208m'
	GREEN = '\033[92m'
	RED = '\033[91m'
	YELLOW = '\033[93m'
	BLUE = '\033[94m'
	RESET = '\033[0m'
		
	@classmethod
	def create_face(cls, colour):
		return [[colour for _ in range(cls.size)] for _ in range(cls.size)]
	
	def __init__(self, size=None):
		if size is not None: self.size = size
		else: self.size = self.__class__.size
		
		self.attribute = {
			'face': ['up',  'left', 'front', 'right', 'back', 'down'],
			'colour': ['white', 'orange', 'green', 'red', 'yellow', 'blue']
		}
		
		# creates a database of faces & colours
		self.faces, self.colours = {}, {}
		for face, colour in zip(self.attribute['face'], self.attribute['colour']): 
			# add colours to dictionary
			self.colours[colour] = getattr(self, colour.upper(), colour)
			# Dynamically set attributes
			setattr(self, face, Cube.create_face(self.colours[colour]))
			# Add to faces to dictionary
			self.faces[face] = getattr(self, face)

	def find_colour_key(self, colour):
		for key, value in self.colours.items():
			if value == colour:
				return key
		return None  # If the color is not found
	
	def face_colour(self, face):
	   # Find the index of the face
	   face_index = self.attribute['face'].index(face)
	   # Use index to get corresponding colour
	   colour = self.attribute['colour'][face_index]
	   return self.colours[colour] #the colour

	def adaptive_update(self, set_of_faces):
		for face in set_of_faces:
			colour = face[1][1] # center colour
			colour = self.find_colour_key(colour)
			if colour:
				# Find the index of the central colour
				colour_index = self.attribute['colour'].index(colour)
				# Get the corresponding face
				expected_face = self.attribute['face'][colour_index]  
				# Verify if the provided face center matches the expected face center
				if face[1][1] == self.faces[expected_face][1][1]:
				# Update face
					setattr(self, expected_face, face)
				# Update the dictionary self.faces
					self.faces[expected_face] = getattr(self, expected_face)
				else: print(f"Warning: face mismatch for face '{face}'. Expected '{expected_face}', got '{face}'.")
			else: print(f"Warning: Colour '{colour}' not found in attributes, update skipped.")

	def rotate(self, face, rotation):
		# Implement rotation logic
		turn = lambda direction: 'anti_clockwise' if direction == 'clockwise' else 'clockwise'
		
		# makes copies of cube for editing
		faces = [copy(f) for f in [self.up, self.left, self.front, self.right, self.back, self.down]]
		up, left, front, right, back, down = faces
		rotated_face = rotate_matrix(self.faces[face], rotation)
		if face in ('down','back','right'):#,
			rotation = turn(rotation) # flipped
		if face in ('up','down'): # yaw turn
			faces = [right,front,left,back]
			last_row, orientation = True, [0,0,0,0] 
			edge = 1 if face == 'up' else 3

		elif face in ('front','back'): # tilt turn
			faces = [left,up,right,down]
			orientation = [0,1,2,3]
			if rotation == 'clockwise':
				last_row = True
				edge = 1 if face == 'front' else 3
			elif rotation == 'anti_clockwise':
				last_row = False
				edge = 1 if face == 'back' else 3
			
		elif face in ('left','right'): # pitch turn
			orientation = [0,0,2,0]
			faces = [front,down,back,up]
			if face == 'left': last_row, edge = False,1
			else: last_row, edge = False, 3
		
		faces = chain_rotation(faces,orientation,rotation,edge,last_row)
		faces.append(rotated_face)
		# update only the needed faces
		self.adaptive_update(faces)
		return self
	
	def display_faces(self):
		for row in range(self.size):
			print('      ', end='')
			display_coloured_row(self.faces[self.attribute['face'][0]],row)
			print('')
		for row in range(self.size):
			for face in self.attribute['face'][1:-1]:
				display_coloured_row(self.faces[face], row)
			print('')
		for row in range(self.size):
			print('      ', end='')
			display_coloured_row(self.faces[self.attribute['face'][-1]],row)
			print('')

	def display_face(self, face):
		for row in range(self.size):
			display_coloured_row(self.faces[face], row)
			print('')
		print('')
	
	def is_solved(self):
		for (colour_name, colour), (face_name, face) in zip(self.colours.items(), self.faces.items()):
			solved_face = self.create_face(colour)
			if face != solved_face:
				return False
		return True