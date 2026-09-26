from cube import Cube
from solver import Solver

def main():
    cube = Cube()
    # Scramble the cube here or load a predefined state
    solver = Solver()
    solution = solver.solve(cube)
    print("Solution:", solution)

if __name__ == "__main__":
    main()