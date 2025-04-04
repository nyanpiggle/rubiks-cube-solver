def transpose(matrix):
	    # Transpose using list comprehension
	    return [list(row) for row in zip(*matrix)]

def reverse(matrix):
		# reverse each row
		return [list(reversed(row)) for row in matrix]

def rotate_matrix(matrix, direction):
	"""
	checks if the matrix needs to be rotated clockwise or anticlockwise, then rotates it
	"""
	if direction == 'clockwise':
		return  reverse(transpose(matrix)) # Transpose then reverse rows
	elif direction == 'anti_clockwise':
		return transpose(reverse(matrix)) # Reverse then Transpose
	else:
		raise ValueError("Direction must be 'clockwise' or 'anti_clockwise'")
		
def copy(matrix):
	# make perfect copies of all faces
	# This function assumes the input is a 2D list (list of lists)
	return [row[:] for row in matrix]
	
def copy_row(matrixA, A, matrixB, rowB, last_row=True, reverse=False):
	# copy matrixA row to matrixB row
	if last_row:
		if not reverse: # copy row
			matrixB[rowB-1] = matrixA[A-1]
		else: # copy row reversed
			matrixB[rowB-1] = matrixA[A-1][::-1]
	# copy matrixA column to matrixB row
	else:
		for i in range(len(matrixA[A-1])):
			if not reverse: # copy column
				matrixB[rowB-1][i] = matrixA[i][A-1]
			else: # copy column reversed
				matrixB[rowB-1][len(matrixA[A-1])-i-1] = matrixA[i][A-1]
	#Cube.display_coloured_face(matrixB)
	return matrixB
	
def copy_column(matrixA, A, matrixB, colB, last_row=False, reverse=False):
	#copy rowA of matrixA to colB of matrixB
	if last_row:
		for i in range(len(matrixA[A-1])):
			if not reverse: # copy row
				matrixB[i][colB-1] = matrixA[A-1][i]
			else: # copy row reversed
				matrixB[len(matrixA[A-1])-i-1][colB-1] = matrixA[A-1][i]
	# copy matrixA column to matrixB column
	else:
		for i in range(len(matrixA)):
			if not reverse: # copy column
				matrixB[i][colB-1] = matrixA[i][A-1]
			else: # copy column reversed
				matrixB[i][colB-1] = matrixA[len(matrixA)-i-1][A-1]
	return matrixB


def display_coloured_row(face, row_index):
	RESET = '\033[0m'
	if 0 <= row_index < len(face):
		row = face[row_index]
		for colour, _ in zip(row, ['[]', '[]', '[]']):
			print(f"{colour}[]{RESET}", end='')
	else:
		print(f"Row index {row_index} is out of range for the given face.")


def mod(a, b, operation, modulus):
    if operation == 'add':
        return (a + b) % modulus
    elif operation == 'subtract':
        return (a - b) % modulus
    elif operation == 'multiply':
        return (a * b) % modulus
    elif operation == 'divide':
        # Only works if modulus is prime and b is not zero
        if modulus <= 1 or b == 0:
            raise ValueError("Division not defined for this modulus or b = 0")
        return (a * pow(b, modulus - 2, modulus)) % modulus  # Using Fermat's little theorem for inverse
    else:
        raise ValueError("Unknown operation")

def modmaths(x, last_row, edgeA):
	edge_converter = lambda edge: 3 if edge == 1 else (1 if edge == 3 else edge)
	if x == 0:
		#keep rows & row orders
		new_row = last_row
		is_reverse = False
		edgeB = edgeA
	elif x == 1:
		#either reverse row orders or rows
		new_row = is_reverse = not last_row
		if last_row: 
			edgeB = edge_converter(edgeA)
		else:
			edgeB = edgeA
	elif x == 2:
		# reverse rows & reverse row orders
		new_row = last_row
		is_reverse = True
		edgeB = edge_converter(edgeA)
	elif x == 3:
		#either reverse rows or row orders
		new_row = not last_row
		is_reverse = last_row
		if not last_row:
			edgeB = edge_converter(edgeA)
		else:
			edgeB = edgeA
	else:
			assert False, "modulus out of range"
	return new_row, edgeB, is_reverse
	
	
def chain_rotation (faces,orient,direction,edge=1,last_row=True):
	#rotates the initial face, easy
	new_faces = []
	m = len(faces)
	assert len(faces) == len(orient), 'the length of faces should be one more than orientations'
	last = lambda x: mod(x, 1, 'subtract', m)
	edgeA = edge # ie 1, 2 or 3
	if direction == 'anti_clockwise':
		#reverse the direction anticlockwise
		faces.reverse()
		orient.reverse()
	for i in range(len(faces)):
		#orient in {0,1,2,3}
		# compare rotations of the two faces
		x=mod(orient[i],orient[last(i)],'subtract',m)
		faceA = faces[last(i)]
		faceB = faces[i]
		new_row, edgeB, is_reverse = modmaths(x, last_row, edgeA)
		if new_row:
			new_face = copy_row(faceA,edgeA,copy(faceB),edgeB,last_row,is_reverse)
		else:
			new_face = copy_column(faceA,edgeA,copy(faceB),edgeB,last_row,is_reverse)
		new_faces.append(new_face)
		edgeA = edgeB
		last_row = new_row
	#print(len(new_faces))
	return new_faces
