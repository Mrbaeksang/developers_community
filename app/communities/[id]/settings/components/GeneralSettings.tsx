'use client'

import { Community } from '@prisma/client'

interface GeneralSettingsProps {
  community: Community
}

export default function CommunityGeneralSettings({
  community,
}: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        커뮤니티 이름, 설명, 규칙 등을 수정할 수 있는 기능이 곧 추가됩니다.
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">현재 설정</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="inline font-medium">이름:</dt>{' '}
              <dd className="inline">{community.name}</dd>
            </div>
            <div>
              <dt className="inline font-medium">URL:</dt>{' '}
              <dd className="inline">/communities/{community.slug}</dd>
            </div>
            <div>
              <dt className="inline font-medium">공개 설정:</dt>{' '}
              <dd className="inline">
                {community.visibility === 'PUBLIC' ? '공개' : '비공개'}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">파일 업로드:</dt>{' '}
              <dd className="inline">
                {community.allowFileUpload ? '허용' : '차단'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
