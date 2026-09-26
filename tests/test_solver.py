# test_solver.py

import sys
sys.path.append('..')  # Add the parent directory to Python's search path

from src.solver import Solver
from src.cube import Cube


def test_solver():
    # Create a new cube instance
    cube = Cube()
    
    # Scramble the cube a bit to test the solver
    # Here we'll do some simple rotations to change its state
    cube.rotate('front','clockwise')
    #cube.rotate('right','clockwise')
    #cube.rotate('up','clockwise')
    #cube.rotate('up','clockwise')
    
    # Display the scrambled cube
    print("Initial Cube:")
    cube.display_faces()
    
    # Instantiate the Solver
    solver = Solver()
    
    # Solve the cube
    solver.solve(cube)
    # Check if the cube is solved
    """
    if cube.is_solved():
        print("\nThe cube has been successfully solved!")
        # Display the solved cube
        print("\nSolved Cube:")
    else:
        print("\nThe cube was not solved correctly.")
    """
    print("new cube")
    cube.display_faces()

if __name__ == "__main__":
    test_solver()
    