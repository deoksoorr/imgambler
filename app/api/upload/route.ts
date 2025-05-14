import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 파일 확장자 추출
    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`
    
    // public/uploads 디렉토리에 저장
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const path = join(uploadDir, fileName)
    
    await writeFile(path, buffer)
    
    return NextResponse.json({ 
      url: `/uploads/${fileName}`,
      message: '파일이 성공적으로 업로드되었습니다.'
    })
  } catch (error) {
    console.error('파일 업로드 중 오류 발생:', error)
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    )
  }
} 