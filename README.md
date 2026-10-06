---

### README Faylını GitHub-a Push Etmək Üçün:

Terminalda `GeoQuake` kök qovluğunda olduğunuzdan əmin olun və aşağıdakı əmrləri icra edin:

<Steps>
  <Step subtitle="1-ci addım" title="Dəyişiklikləri əlavə edin">
    ```bash
    git add README.md
    ```
  </Step>

  <Step subtitle="2-ci addım" title="Commit yaradın">
    ```bash
    git commit -m "docs: add comprehensive README.md"
    ```
  </Step>

  <Step subtitle="3-cü addım" title="GitHub-a push edin">
    ```bash
    git push origin main
    ```
  </Step>
</Steps>

<Elicitations message="README faylını əlavə edib push edə bildiniz?">
  <Elicitation label="Push uğurlu oldu" query="README faylını push etdim. İndi backend və frontend-i eyni anda necə işə salım?"/>
  <Elicitation label="Git xətası aldım" query="README faylını push edəndə xəta aldım, nə etməliyəm?"/>
</Elicitations>