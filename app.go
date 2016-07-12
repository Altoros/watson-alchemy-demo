package main

import (
	"fmt"
	"os"

	"github.com/Altoros/watson-alchemy-demo/alchemy_language"
	"github.com/cloudfoundry-community/go-cfenv"
	"github.com/gin-gonic/gin"
)

func main() {
	var port string
	var alchemy *alchemy_language.Client

	if appEnv, err := cfenv.Current(); err != nil {
		port = ":8080"
		alchemy = alchemy_language.New("https://gateway-a.watsonplatform.net/calls", os.Getenv("ALCHEMY_APIKEY"))
	} else {
		port = fmt.Sprintf(":%d", appEnv.Port)
		if alchemyService, err := appEnv.Services.WithLabel("alchemy_api"); err == nil {
			alchemy = alchemy_language.New(alchemyService[0].Credentials["url"].(string),
				alchemyService[0].Credentials["apikey"].(string))
		}
	}
	r := gin.Default()
	r.GET("/url", func(c *gin.Context) {
		url := c.Query("url")
		if url == "" {
			c.JSON(400, gin.H{"error": "url is required"})
			return
		}
		res, err := alchemy.URLGetCombinedData(url)
		if err != nil {
			c.String(500, err.Error())
			return
		}
		c.String(200, res)

	})
	r.POST("/text", func(c *gin.Context) {
		text := c.PostForm("text")
		if text == "" {
			c.JSON(400, gin.H{"error": "text is required"})
			return
		}
		res, err := alchemy.TextGetCombinedData(text)
		if err != nil {
			c.String(500, err.Error())
			return
		}
		c.String(200, res)
	})

	r.Run(port)
}
