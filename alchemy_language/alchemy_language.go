package alchemy_language

import (
	"fmt"

	"gopkg.in/h2non/gentleman.v1"
)

type Client struct {
	url, apikey string
}

func New(url, apikey string) *Client {
	return &Client{url, apikey}
}

func (c *Client) URLGetCombinedData(url string) (string, error) {
	return c.GetCombinedData("/url/URLGetCombinedData", "GET", "url", url)
}

func (c *Client) TextGetCombinedData(text string) (string, error) {
	return c.GetCombinedData("/text/TextGetCombinedData", "POST", "text", text)
}

func (c *Client) GetCombinedData(call, method, param, value string) (string, error) {
	req := gentleman.New().Request().URL(fmt.Sprintf("%s%s", c.url, call))
	req.Method(method)
	req.AddQuery("apikey", c.apikey)
	req.AddQuery(param, value)
	req.AddQuery("outputMode", "json")
	req.AddQuery("extract", "doc-emotion,keywords,concepts")
	res, err := req.Send()
	if err != nil {
		return "", fmt.Errorf("Request error: %s", err)
	}
	if !res.Ok {
		return "", fmt.Errorf("Invalid server response: %d", res.StatusCode)
	}
	return res.String(), nil
}
