import sys
sys.path.append('..')  # Add the parent directory to Python's search path

from src.cube import Cube
import src.utils

class Solver:
    def solve(self, cube):
        # Implement a simple solving algorithm
        self._solve_up_cross(cube)
        # Further steps would be added here...
    def _solve_up_cross(self, cube):
        # Step 1: Solve the up Cross
        up_color = cube.face_colour('up')
        front_color = cube.face_colour('front')
        faces = ['left', 'front', 'right', 'back']
        # Check all four edges
        for face in faces:
            for i, j in [(0, 1), (1, 0), (1, 2), (2, 1)]: 
                edge = cube.faces[face][i][j]
                if edge == up_color:
                    # Rotate the face until the edge aligns with the up
                    while cube.faces[face][0][1] == up_color:
                    	cube.rotate(face, 'clockwise')
                    	# Now align the edge with the correct side color
                	        
                    side_color = cube.face_colour(face)
                    while cube.faces['up'][2][1] != side_color:  # Assuming [1][1] is where this edge would end up on up
                        cube.rotate(face, 'clockwise')
                        break
                    # Move the edge to the up
                    cube.rotate(face, 'clockwise')
                    cube.rotate('up', 'clockwise')
                    cube.rotate(face, 'anti_clockwise')
                    break  # Move to the next edge
    
    def _solve_up_corners(self, cube):
        up_color = cube.face_colour('up')
        for corner_position in ['front-left', 'front-right', 'back-left', 'back-right']:
            corner_colors = self._get_corner_colors(cube, corner_position)
            if corner_colors[0] == up_color:  # If the up color is already on up
                # Rotate until it's in the right spot or use a specific algorithm
                if not self._corner_orientation_correct(cube, corner_position, corner_colors):
                    # Use an algorithm to correct the orientation
                    self._orient_corner(cube, corner_position)
                    pass
            else:
                # Find the corner in the bottom layer
                # Use an algorithm like "Right down Right' down'" to move it up
                pass

    # Helper methods:
    def _corner_orientation_correct(self, cube, corner_position, corner_colors):
        # Check if the colors on the sides match the expected sides
        # This is a simple check; you might need to adjust based on your cube representation
        expected_sides = self._get_expected_corner_colors(corner_position)
        return all(corner_colors[i] == expected_sides[i] for i in range(1, 3))

    def _orient_corner(self, cube, corner_position):
        # algorithm for twist front-right corner:
        # U R U' L' U R' U' L
        #120 degrees anti clockwise
        if corner_position == 'up-front-right':
            for i in range(2):
                cube.rotate('right','anti_clockwise')
                cube.rotate('down','anti_clockwise')
                cube.rotate('right','clockwise')
                cube.rotate('down','clockwise')

    def _get_expected_corner_colors(self, corner_position):
        # Assuming you have a method or dictionary defining color schemes
        # For example:
        color_scheme = {
            'front-left': [cube.face_colour('up'), cube.face_colour('front'), cube.face_colour('left')],
            # ... for other positions
        }
        return color_scheme[corner_position]
    
    def _up_front_right(self, cube, corner_position):
        "rotates the up front right corne anti clockwise :3"
        if corner_position == 'front-left':
            cube.rotate('up', 'anti_clockwise')
            #any corner to be twisted must
            #go to the UFR (up, front, right)
            for i in range(1):
                self._orient_corner(cube, 'up-front-right')
            cube.rotate('up', 'clockwise')

        return
