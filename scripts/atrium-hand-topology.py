"""Connected quad palm with explicit finger/ thumb boundary loops (study)."""
import math,os
from mathutils import Vector, Quaternion

def build(side):
    xs=[-.049,-.042,-.033,-.024,-.020,-.011,-.002,.002,.011,.020,.024,.033,.042,.049]
    ys=[-.019,-.013,0,.013,.019]
    sections=[(-.040,.049,.019),(-.028,.052,.021),(-.016,.054,.022),(-.004,.052,.023),(.008,.048,.024),(.020,.044,.024),(.034,.039,.023),(.045,.035,.021)]
    vertices=[];faces=[];lookup={};digits={}
    sculpt=os.environ.get('ATRIUM_PALM_SCULPT_STUDY','0')=='1'
    nx,ny=len(xs),len(ys)
    def vertex(i,j,k):
        key=(i,j,k)
        if key not in lookup:
            z,w,d=sections[k];u=xs[i]/.049;v=ys[j]/.019
            point=Vector((w*u*(1-.08*v*v),d*v*(1-.10*u*u),z))
            if sculpt:
                s=(z+.040)/.085;blend=math.sin(math.pi*(1-s)/2)
                # Rounded transverse sections, a shallow metacarpal arch and
                # asymmetric palm padding; preserve the wrist ring exactly.
                point.x=(1-blend)*point.x+blend*w*u*math.sqrt(1-.40*v*v)
                point.y=(1-blend)*point.y+blend*d*v*math.sqrt(1-.75*u*u)
                point.z+=(-.006+.010*u*u)*(1-s)**2
                if v<0:
                    point.y+=math.sin(math.pi*s)*(.0025*(1-u*u)*(-v)-.004*math.exp(-((u+.65)/.30)**2)*v*v)
                else:point.y+=.002*(1-u*u)*math.sin(math.pi*s)*v
            lookup[key]=len(vertices);vertices.append(point)
        return lookup[key]
    # End caps are grids with four explicit holes, not intersecting primitives.
    holes=[(1,3),(4,6),(7,9),(10,12)]
    for k in [0,len(sections)-1]:
        for i in range(nx-1):
            for j in range(ny-1):
                if k==0 and j in [1,2] and any(a<=i<b for a,b in holes):continue
                faces.append(tuple(vertex(a,b,k) for a,b in [(i,j),(i+1,j),(i+1,j+1),(i,j+1)]))
    perimeter=[(i,0) for i in range(nx)]+[(nx-1,j) for j in range(1,ny)]+[(i,ny-1) for i in range(nx-2,-1,-1)]+[(0,j) for j in range(ny-2,0,-1)]
    for k in range(len(sections)-1):
        for (i,j),(a,b) in zip(perimeter,perimeter[1:]+perimeter[:1]):
            if i==a==0 and k in [3,4] and min(j,b) in [1,2]:continue
            faces.append((vertex(i,j,k),vertex(a,b,k),vertex(a,b,k+1),vertex(i,j,k+1)))
    def bridge(previous,current):
        for a in range(8):faces.append((previous[a],previous[(a+1)%8],current[(a+1)%8],current[a]))
    def finish(loop,center,label):
        tip=len(vertices);vertices.append(center)
        for a in range(8):faces.append((loop[a],loop[(a+1)%8],tip))
        digits.setdefault(label,[]).append(tip)
    for digit,((left,right),length) in enumerate(zip(holes,[.057,.068,.064,.052]),1):
        middle=(left+right)//2
        loop=[vertex(i,j,0) for i,j in [(left,1),(middle,1),(right,1),(right,2),(right,3),(middle,3),(left,3),(left,2)]]
        center=sum((vertices[i] for i in loop),Vector())/8
        vectors=[vertices[i]-center for i in loop];distance=length-.015
        digits[digit]=list(loop)
        for t in [.10,.25,.40,.50,.65,.75,.90,.98]:
            current=[];scale=1-.20*t-.45*t**4
            for offset in vectors:
                # Round rectangle corners while retaining the exact shared root.
                angle=math.atan2(offset.y/.013,offset.x/.009)
                ellipse=Vector((.009*math.cos(angle),.013*math.sin(angle),0))
                radial=offset.lerp(ellipse,min(1,t/.25))*scale
                current.append(len(vertices));vertices.append(center+Vector((0,-.28*distance*t,-distance*t))+radial)
            bridge(loop,current);loop=current;digits[digit].extend(current)
        finish(loop,center+Vector((0,-.28*distance,-distance-.002)),digit)
    # The thumb shares an eight-vertex hole in the side of the palm.
    loop=[vertex(0,j,k) for j,k in [(1,3),(2,3),(3,3),(3,4),(3,5),(2,5),(1,5),(1,4)]]
    center=sum((vertices[i] for i in loop),Vector())/8
    vectors=[vertices[i]-center for i in loop]
    direction=Vector((-.58,-.23,-.78)).normalized()
    rotation=Vector((-1,0,0)).rotation_difference(direction)
    digits[0]=list(loop)
    for t in [.12,.28,.44,.60,.76,.90,.98]:
        turn=Quaternion().slerp(rotation,min(1,t/.44));current=[]
        for offset in vectors:
            rounded=offset.normalized()*.013
            radial=offset.lerp(rounded,min(1,t/.44))*(1-.50*t**3)
            current.append(len(vertices));vertices.append(center+direction*(.052*t)+turn@radial)
        bridge(loop,current);loop=current;digits[0].extend(current)
    finish(loop,center+direction*.054,0)
    # Mirror the entire hand so thumb and digit lengths follow the same layout.
    return [(p.x*side,p.y,p.z) for p in vertices],faces,digits
